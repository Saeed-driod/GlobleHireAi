#!/usr/bin/env bash
set -e

echo "=== 1. Writing Nginx Site Configuration ==="
cat << 'EOF' > /tmp/nginx_default
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    client_max_body_size 150M;

    # GlobalHire AI Reverse Proxy
    location /jobs-api/ {
        proxy_pass http://127.0.0.1:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }

    # GlobalPulse AI (Default)
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
    }
}
EOF
sudo cp /tmp/nginx_default /etc/nginx/sites-available/default
sudo nginx -t
sudo systemctl reload nginx

echo "=== 2. Creating GlobalHire API Systemd Service ==="
sudo bash -c 'cat << "EOF" > /etc/systemd/system/globalhire-api.service
[Unit]
Description=GlobalHire AI FastAPI Server (Port 5001)
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/global-job-portal
Environment=PATH=/home/ubuntu/global-job-portal/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/ubuntu/global-job-portal/venv/bin/uvicorn app:app --host 0.0.0.0 --port 5001 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF'

echo "=== 3. Creating GlobalHire Worker Systemd Service ==="
sudo bash -c 'cat << "EOF" > /etc/systemd/system/globalhire-worker.service
[Unit]
Description=GlobalHire AI 24/7 Auto-Pilot Job Aggregator
After=network.target globalhire-api.service

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/global-job-portal
Environment=PATH=/home/ubuntu/global-job-portal/venv/bin:/usr/local/bin:/usr/bin:/bin
ExecStart=/home/ubuntu/global-job-portal/venv/bin/python -u job_worker.py --interval 10800
Restart=always
RestartSec=15

[Install]
WantedBy=multi-user.target
EOF'

echo "=== 4. Reloading and Starting Systemd Services ==="
sudo systemctl daemon-reload
sudo systemctl enable globalhire-api.service
sudo systemctl restart globalhire-api.service

sudo systemctl enable globalhire-worker.service
sudo systemctl restart globalhire-worker.service

echo "=== 5. Verifying Service Status ==="
sleep 2
sudo systemctl status globalhire-api.service --no-pager -l
sudo systemctl status globalhire-worker.service --no-pager -l

echo "=== 6. Testing Port 5001 Locally ==="
curl -s http://127.0.0.1:5001/ | grep -o '"service":"GlobalHire AI API"' || true
curl -s http://127.0.0.1:5001/api/dashboard/stats | head -c 200 || true
echo ""
echo "=== 7. Testing Nginx Proxy /jobs-api/ ==="
curl -s http://127.0.0.1/jobs-api/ | grep -o '"service":"GlobalHire AI API"' || true
echo ""
echo "=== SETUP COMPLETE SUCCESSFULLY ==="

