const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const scriptPath = 'D:\\deepclaw\\projects\\wellness_app\\scripts\\backup_db.js';
const taskName = 'WellnessAppDBBackup';

// 创建 XML 任务定义
const xml = `<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.4" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>${new Date().toISOString()}</Date>
    <Author>WellnessApp</Author>
    <Description>每日自动备份 wellness.db 到本地和远程服务器</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <Repetition>
        <Interval>PT1D</Interval>
        <Duration>P1D</Duration>
        <StopAtDurationEnd>false</StopAtDurationEnd>
      </Repetition>
      <StartBoundary>2026-06-08T03:00:00</StartBoundary>
      <Enabled>true</Enabled>
      <ScheduleByDay>
        <DaysInterval>1</DaysInterval>
      </ScheduleByDay>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <LogonType>InteractiveToken</LogonType>
      <RunLevel>LeastPrivilege</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <Enabled>true</Enabled>
    <AllowStartOnDemand>true</AllowStartOnDemand>
    <AllowHardTerminate>true</AllowHardTerminate>
    <StartWhenAvailable>false</StartWhenAvailable>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <StopIfGoingOnBatteries>false</StopIfGoingOnBatteries>
    <DisallowStartIfOnBatteries>false</DisallowStartIfOnBatteries>
    <MultipleInstancesPolicy>IgnoreNew</MultipleInstancesPolicy>
    <IdleSettings>
      <StopOnIdleEnd>true</StopOnIdleEnd>
      <RestartOnIdle>false</RestartOnIdle>
    </IdleSettings>
    <UseUnifiedSchedulingEngine>true</UseUnifiedSchedulingEngine>
    <WakeToRun>false</WakeToRun>
    <ExecutionTimeLimit>PT30M</ExecutionTimeLimit>
    <Priority>7</Priority>
  </Settings>
  <Actions Context="Author">
    <Exec>
      <Command>C:\\Program Files\\nodejs\\node.exe</Command>
      <Arguments>"${scriptPath}"</Arguments>
      <WorkingDirectory>D:\\deepclaw\\projects\\wellness_app</WorkingDirectory>
    </Exec>
  </Actions>
</Task>`;

const xmlPath = path.join(process.env.TEMP || 'D:\\deepclaw', 'backup_task.xml');
fs.writeFileSync(xmlPath, xml, 'utf16le');

try {
  // 删除旧任务（如有）
  execSync(`schtasks /Delete /TN "${taskName}" /F`, { timeout: 5000, windowsHide: true, stdio: 'pipe' });
} catch(e) { /* 不存在，没关系 */ }

// 创建新任务
try {
  execSync(
    `schtasks /Create /XML "${xmlPath}" /TN "${taskName}" /F`,
    { timeout: 10000, windowsHide: true, stdio: 'pipe' }
  );
  
  // 立即运行一次测试
  execSync(
    `schtasks /Run /TN "${taskName}"`,
    { timeout: 5000, windowsHide: true, stdio: 'pipe' }
  );
  
  console.log('✅ 定时备份任务已创建！');
  console.log('   任务名：' + taskName);
  console.log('   执行时间：每天凌晨 3:00');
  console.log('   保留：最近30天');
  console.log('   已触发一次测试运行');
  
  // 查看任务状态
  const status = execSync(
    `schtasks /Query /TN "${taskName}" /FO LIST /V`,
    { timeout: 5000, windowsHide: true, encoding: 'utf8', stdio: 'pipe' }
  );
  console.log('\n--- 任务状态 ---');
  console.log(status);
  
} catch(e) {
  console.error('❌ 创建定时任务失败：' + e.message);
  console.log('\n手动设置方法：');
  console.log('1. 打开 "任务计划程序"');
  console.log('2. 点 "创建基本任务"');
  console.log('3. 名称：WellnessAppDBBackup');
  console.log('4. 触发器：每天');
  console.log('5. 时间：03:00');
  console.log('6. 操作：启动程序');
  console.log('7. 程序：node.exe');
  console.log('8. 参数："D:\\deepclaw\\projects\\wellness_app\\scripts\\backup_db.js"');
}
