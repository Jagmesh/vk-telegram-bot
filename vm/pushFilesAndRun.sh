#!/bin/bash
SUB="hostvm"
while read line
do
  if [[ "$line" == *"$SUB"* ]]; then
    hostvm=${line#*=}
  fi
done < .env

ssh root@$hostvm "mkdir /home/scripts/";
scp .env root@$hostvm:/home/scripts/;
scp ./installDocker.sh root@$hostvm:/home/scripts/;

ssh root@$hostvm "bash /home/scripts/installDocker.sh";