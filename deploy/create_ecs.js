/**
 * Create Alibaba Cloud ECS Instance via REST API
 * No SDK dependency issues
 */
const https = require('https');
const crypto = require('crypto');
const querystring = require('querystring');

const AK_ID = process.env.ALI_AK_ID;
const AK_SECRET = process.env.ALI_AK_SECRET;
const REGION = process.env.ALI_REGION || 'cn-hangzhou';

function encode(s) {
  return encodeURIComponent(s)
    .replace(/!/g, '%21')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\*/g, '%2A');
}

function sign(secret, stringToSign) {
  return crypto.createHmac('sha1', secret + '&').update(stringToSign).digest('base64');
}

function makeParams(action, params) {
  const p = {
    Format: 'JSON',
    Version: '2014-05-26',
    AccessKeyId: AK_ID,
    SignatureMethod: 'HMAC-SHA1',
    Timestamp: new Date().toISOString().replace(/\.\d{3}/, ''),
    SignatureVersion: '1.0',
    SignatureNonce: crypto.randomUUID(),
    RegionId: REGION,
    Action: action,
    ...params,
  };
  delete p.Signature;
  const keys = Object.keys(p).sort();
  const canonicalizedQuery = keys.map(k => encode(k) + '=' + encode(p[k])).join('&');
  const stringToSign = 'GET&' + encode('/') + '&' + encode(canonicalizedQuery);
  p.Signature = sign(AK_SECRET, stringToSign);
  return p;
}

function apiCall(action, params) {
  return new Promise((resolve, reject) => {
    const p = makeParams(action, params);
    const qs = Object.keys(p).map(k => encode(k) + '=' + encode(p[k])).join('&');
    const url = `https://ecs.aliyuncs.com/?${qs}`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.Code) reject(new Error(j.Message || j.Code));
          else resolve(j);
        } catch(e) {
          reject(new Error('Parse error: ' + data.slice(0, 500)));
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const cmd = process.argv[2] || 'help';
  
  try {
    switch (cmd) {
      case 'list-regions': {
        const r = await apiCall('DescribeRegions', {});
        console.log('Available Regions:');
        r.Regions.Region.forEach(x => console.log(`  ${x.RegionId} — ${x.LocalName}`));
        break;
      }
      case 'list-zones': {
        const zone = process.argv[3] || REGION;
        const r = await apiCall('DescribeZones', { RegionId: zone });
        console.log(`Zones in ${zone}:`);
        (r.Zones.Zone || []).forEach(z => {
          const types = z.AvailableResourceCreation?.ResourceTypes || [];
          console.log(`  ${z.ZoneId} — CPU: ${types.includes('Instance') ? '✓' : '✗'}, Disk: ${types.includes('Disk') ? '✓' : '✗'}, VSwitch: ${types.includes('VSwitch') ? '✓' : '✗'}`);
        });
        break;
      }
      case 'list-images': {
        const region = process.argv[3] || REGION;
        const r = await apiCall('DescribeImages', { RegionId: region, ImageOwnerAlias: 'system', Status: 'Available', PageSize: '30' });
        console.log('System Images (Ubuntu/CentOS):');
        (r.Images.Image || []).filter(x => x.OSNameEn.includes('Ubuntu') || x.OSNameEn.includes('CentOS') || x.OSNameEn.includes('Alibaba')).forEach(x => {
          console.log(`  ${x.ImageId} — ${x.OSName} (${x.Size}GB)`);
        });
        break;
      }
      case 'list-vpcs': {
        const region = process.argv[3] || REGION;
        const r = await apiCall('DescribeVpcs', { RegionId: region, PageSize: '10' });
        console.log(`VPCs in ${region}:`);
        (r.Vpcs.Vpc || []).forEach(v => {
          const vs = v.VSwitchIds?.VSwitchId || [];
          const sg = v.SecurityGroupIds?.SecurityGroupId || [];
          console.log(`  ${v.VpcId} — ${v.VpcName || 'unnamed'} (${v.Status}, CIDR: ${v.CidrBlock})`);
          console.log(`    VSwitches: ${vs.length}, SecurityGroups: ${sg.length}`);
        });
        break;
      }
      case 'list-specs': {
        const r = await apiCall('DescribeInstanceTypes', {});
        console.log('Affordable Instance Types (≤2C, ≤4G):');
        (r.InstanceTypes.InstanceType || []).filter(t => {
          const c = parseInt(t.CpuCoreCount);
          const m = parseFloat(t.MemorySize);
          return c <= 2 && m <= 4;
        }).sort((a,b) => parseFloat(a.MemorySize) - parseFloat(b.MemorySize)).forEach(t => {
          const price = t.PriceStr || (t.GPUSpec ? 'GPU' : 'N/A');
          console.log(`  ${t.InstanceTypeId} — ${t.CpuCoreCount}C${parseInt(t.MemorySize)}G (${t.InstanceFamilyLevel || ''}) — LocalDisk: ${t.LocalStorageAmount || 0}`);
        });
        break;
      }
      case 'check-quota': {
        const spec = process.argv[3] || 'ecs.t6-c4m1.large';
        const region = process.argv[4] || REGION;
        try {
          const r = await apiCall('DescribeAvailableResource', {
            RegionId: region,
            DestinationResource: 'InstanceType',
            InstanceType: spec,
            ZoneId: process.argv[5] || '',
          });
          const z = r.AvailableZones.AvailableZone || [];
          z.forEach(az => {
            console.log(`Zone ${az.ZoneId}: ${az.Status === 'Available' ? '✓ Available' : '✗ ' + az.Status}`);
          });
        } catch(e) {
          // Maybe no quota, try DescribeInstanceTypeFamilies to find available ones
          console.log('Direct check failed. Listing available families...');
        }
        break;
      }
      case 'check-quota-simple': {
        const region = process.argv[3] || REGION;
        // Try different methods
        const methods = [
          ['DescribeInstanceTypeFamilies', { RegionId: region, Generation: 'ecs-5' }],
          ['DescribeInstanceTypeFamilies', { RegionId: region, Generation: 'ecs-4' }],
        ];
        for (const [action, params] of methods) {
          try {
            const r = await apiCall(action, params);
            const families = r.InstanceTypeFamilies?.InstanceTypeFamily || [];
            console.log(`${params.Generation}:`);
            families.forEach(f => console.log(`  ${f.InstanceTypeFamilyId} — ${f.Status}`));
          } catch(e) {
            // skip
          }
        }
        break;
      }
      case 'create': {
        const instanceType = process.argv[3] || 'ecs.t6-c4m1.large';
        const zoneId = process.argv[4] || 'cn-hangzhou-i';
        const imageId = process.argv[5] || 'ubuntu_24_04_x64_20G_alibase_20250528.vhd';
        const password = process.argv[6] || 'WellnessApp@2025';
        const region = process.argv[7] || REGION;

        // Try to find an existing VPC and security group
        let vpcId = '';
        let vSwitchId = '';
        let sgId = '';
        
        try {
          const vpcRes = await apiCall('DescribeVpcs', { RegionId: region, PageSize: '5' });
          const vpcs = vpcRes.Vpcs?.Vpc || [];
          if (vpcs.length > 0) {
            vpcId = vpcs[0].VpcId;
            // Get vSwitches
            const vsRes = await apiCall('DescribeVSwitches', { RegionId: region, VpcId: vpcId });
            const vswitches = vsRes.VSwitches?.VSwitch || [];
            const targetVSwitch = vswitches.find(v => v.ZoneId === zoneId) || vswitches[0];
            if (targetVSwitch) {
              vSwitchId = targetVSwitch.VSwitchId;
            }
            // Get security groups
            const sgRes = await apiCall('DescribeSecurityGroups', { RegionId: region, VpcId: vpcId });
            const sgs = sgRes.SecurityGroups?.SecurityGroup || [];
            if (sgs.length > 0) {
              sgId = sgs[0].SecurityGroupId;
            }
          }
        } catch(e) {
          console.log('No existing VPC/SG found, will use default VPC');
        }

        console.log('Creating ECS instance...');
        console.log(`  Region: ${region}`);
        console.log(`  Zone: ${zoneId}`);
        console.log(`  Type: ${instanceType}`);
        console.log(`  Image: ${imageId}`);
        console.log(`  VPC: ${vpcId}`);
        console.log(`  VSwitch: ${vSwitchId}`);
        console.log(`  SecurityGroup: ${sgId}`);

        const createParams = {
          RegionId: region,
          ZoneId: zoneId,
          InstanceType: instanceType,
          ImageId: imageId,
          SystemDiskCategory: 'cloud_essd',
          SystemDiskSize: '40',
          InternetChargeType: 'PayByTraffic',
          InternetMaxBandwidthOut: '5',
          InstanceChargeType: 'PostPaid',
          InstanceName: 'wellness-app-server',
          Password: password,
          SecurityEnhancementStrategy: 'Active',
        };
        if (vSwitchId) createParams.VSwitchId = vSwitchId;
        if (sgId && !vSwitchId) createParams.SecurityGroupId = sgId;

        const r = await apiCall('CreateInstance', createParams);
        const instanceId = r.InstanceId;
        console.log('\n✅ Instance created:', instanceId);

        // Wait
        console.log('Waiting for Stopped status...');
        await waitForStatus(region, instanceId, 'Stopped');

        // Allocate public IP
        console.log('Allocating public IP...');
        await apiCall('AllocatePublicIpAddress', { RegionId: region, InstanceId: instanceId });

        // Authorize security group ports (80, 443, 22, 8000)
        if (sgId) {
          console.log('Configuring security group rules...');
          for (const port of ['22', '80', '443', '8000']) {
            try {
              await apiCall('AuthorizeSecurityGroup', {
                RegionId: region,
                SecurityGroupId: sgId,
                IpProtocol: 'tcp',
                PortRange: port + '/' + port,
                SourceCidrIp: '0.0.0.0/0',
              });
              console.log(`  Port ${port} opened`);
            } catch(e) { /* may already exist */ }
          }
        }

        // Start
        console.log('Starting instance...');
        await apiCall('StartInstance', { RegionId: region, InstanceId: instanceId });
        await waitForStatus(region, instanceId, 'Running');

        // Get info
        const info = await apiCall('DescribeInstanceAttribute', { RegionId: region, InstanceId: instanceId });
        console.log('\n🎉 ECS Instance Ready!');
        console.log(`  Instance ID: ${instanceId}`);
        console.log(`  Public IP: ${info.PublicIpAddress || info.IpAddress || 'N/A'}`);
        console.log(`  Private IP: ${info.VpcAttributes?.PrivateIpAddress?.IpAddress?.[0] || 'N/A'}`);
        console.log(`  Status: ${info.Status}`);
        console.log(`  SSH: ssh root@${info.PublicIpAddress || info.IpAddress}`);
        break;
      }
      case 'list-instances': {
        const region = process.argv[3] || REGION;
        const r = await apiCall('DescribeInstances', { RegionId: region, PageSize: '50' });
        console.log(`ECS Instances in ${region}:`);
        (r.Instances.Instance || []).forEach(inst => {
          console.log(`  ${inst.InstanceId} — ${inst.InstanceName || 'unnamed'} [${inst.Status}]`);
          const pubIp = inst.PublicIpAddress?.IpAddress?.[0] || inst.EipAddress?.IpAddress || 'N/A';
          console.log(`    IP: ${pubIp} | Type: ${inst.InstanceType} | Created: ${inst.CreationTime}`);
        });
        break;
      }
      case 'get-instance': {
        const instanceId = process.argv[3];
        const region = process.argv[4] || REGION;
        if (!instanceId) { console.log('Usage: node create_ecs.js get-instance <instance-id> [region]'); break; }
        const r = await apiCall('DescribeInstanceAttribute', { RegionId: region, InstanceId: instanceId });
        console.log('Full Instance Info:');
        console.log(JSON.stringify(r, null, 2));
        break;
      }
      case 'stop-instance': {
        const instanceId = process.argv[3];
        const region = process.argv[4] || REGION;
        if (!instanceId) { console.log('Usage: node create_ecs.js stop-instance <instance-id>'); break; }
        await apiCall('StopInstance', { RegionId: region, InstanceId: instanceId });
        console.log('Instance stopped:', instanceId);
        break;
      }
      case 'delete-instance': {
        const instanceId = process.argv[3];
        const region = process.argv[4] || REGION;
        if (!instanceId) { console.log('Usage: node create_ecs.js delete-instance <instance-id>'); break; }
        // Must stop first
        try { await apiCall('StopInstance', { RegionId: region, InstanceId: instanceId }); } catch(e) {}
        await new Promise(r => setTimeout(r, 5000));
        await apiCall('DeleteInstance', { RegionId: region, InstanceId: instanceId, Force: 'true' });
        console.log('Instance deleted:', instanceId);
        break;
      }
      default: {
        console.log(`
Usage: node ${process.argv[1]} <command> [args]

Commands:
  list-regions                   — List all available regions
  list-zones [region]            — List zones in region
  list-images [region]           — List system images
  list-specs                     — List affordable instance types
  check-quota <spec> [region]    — Check if instance type is available
  list-vpcs [region]             — List VPCs and security groups
  create [type] [zone] [image] [password] [region] — Create ECS instance
  list-instances [region]        — List all instances
  get-instance <id> [region]     — Get instance details
  stop-instance <id> [region]    — Stop an instance
  delete-instance <id> [region]  — Delete an instance
        `);
      }
    }
  } catch (err) {
    console.error('Error:', err.message);
    if (err.message && err.message.includes('{')) {
      try { console.error(JSON.stringify(JSON.parse(err.message.match(/\{.*\}/)?.[0] || '{}'), null, 2)); } catch(e) {}
    }
  }
}

function waitForStatus(region, instanceId, targetStatus) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 40;
    const check = async () => {
      attempts++;
      try {
        const r = await apiCall('DescribeInstanceAttribute', { RegionId: region, InstanceId: instanceId });
        if (r.Status === targetStatus) {
          console.log(`  → Status: ${targetStatus}`);
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error(`Timeout waiting for ${targetStatus}, last status: ${r.Status}`));
        } else {
          process.stdout.write('.');
          setTimeout(check, 3000);
        }
      } catch (e) {
        if (attempts >= maxAttempts) reject(e);
        else { process.stdout.write('x'); setTimeout(check, 3000); }
      }
    };
    check();
  });
}

main();
