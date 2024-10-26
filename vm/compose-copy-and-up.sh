#!/bin/bash
SUB="hostvm"
while read line
do
  if [[ "$line" == *"$SUB"* ]]; then
    hostvm=${line#*=}
  fi
done < .env

scp ./docker-compose.yaml root@$hostvm:/home/scripts/;
ssh root@$hostvm "docker compose -f /home/scripts/docker-compose.yaml pull"
ssh root@$hostvm "docker compose -f /home/scripts/docker-compose.yaml up -d --remove-orphans"
ssh root@$hostvm "docker image prune -f"