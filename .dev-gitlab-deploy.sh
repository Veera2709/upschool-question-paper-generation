#!/bin/bash

set -f
server_name=$DEV_SERVER
echo "Server name: $server_name"
ssh -o StrictHostKeyChecking=no ec2-user@$server_name "cd /upschool/questionPaper/dev/upschool-question-paper-generation && sudo git reset --hard && sudo git pull https://github.com/Veera2709/upschool-question-paper-generation.git --set-upstream origin/dev && sudo npm install && sudo node node_modules/puppeteer-core/install.js && sudo pm2 restart 0"
