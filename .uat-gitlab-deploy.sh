#!/bin/bash

set -f
server_name=$UAT_SERVER
echo "Server name: $server_name"
ssh -o StrictHostKeyChecking=no ec2-user@$server_name "cd /upschool/questionPaper/uat/upschool-question-paper-generation && sudo git reset --hard && sudo git pull https://gitlab.com/Veera27/upschool-question-paper-generation.git --set-upstream uat && sudo npm install && sudo node node_modules/puppeteer-core/install.js && sudo pm2 restart 2"