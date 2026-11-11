#!/bin/bash
set -e

cat << 'EOF' > /tmp/globalhire-api.service
[Unit]
Description=GlobalHire AI FastAPI Server (Port 5001)
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/global-job-portal
EnvironmentFile=/home/ubuntu/global-job-portal/.env
Environment=PATH=/home/ubuntu/global-job-portal/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/ubuntu/global-job-portal/venv/bin/uvicorn app:app --host 0.0.0.0 --port 5001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

cat << 'EOF' > /tmp/globalhire-worker.service
[Unit]
Description=GlobalHire AI 24/7 Worldwide Job Aggregator Worker
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/global-job-portal
EnvironmentFile=/home/ubuntu/global-job-portal/.env
Environment=PATH=/home/ubuntu/global-job-portal/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/ubuntu/global-job-portal/venv/bin/python job_worker.py --daemon --interval 180
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo mv /tmp/globalhire-api.service /etc/systemd/system/globalhire-api.service
sudo mv /tmp/globalhire-worker.service /etc/systemd/system/globalhire-worker.service
sudo systemctl daemon-reload
sudo systemctl restart globalhire-api
sudo systemctl restart globalhire-worker
echo "SERVICES_UPDATED_SUCCESSFULLY"

