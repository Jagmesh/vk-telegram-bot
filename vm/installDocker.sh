#!/bin/bash
# 1. Обновить список пакетов командой:
sudo apt-get update
# 2. Установить необходимые пакеты для добавления репозитория Docker командой:
sudo apt-get install apt-transport-https ca-certificates curl gnupg-agent software-properties-common -y
# 3. Добавить ключ GPG для проверки целостности пакетов Docker командой:
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
# 4. Добавить репозиторий Docker командой:
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
# 5. Обновить список пакетов командой:
sudo apt-get update
# 6. Установить Docker командой:
sudo apt-get install docker-ce docker-ce-cli containerd.io -y
# 7. Установить docker-compose
sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose