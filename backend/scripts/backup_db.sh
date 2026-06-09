#!/bin/bash
# Backup wellness.db daily
BACKUP_DIR=/opt/wellness-app/backend/data/backups
DB_PATH=/opt/wellness-app/backend/data/wellness.db
mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/wellness-$(date +%Y%m%d-%H%M%S).db
# Keep only last 30 backups
ls -t $BACKUP_DIR/wellness-*.db | tail -n +31 | xargs -r rm
