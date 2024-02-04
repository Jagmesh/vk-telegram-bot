#!/bin/bash
SUB="hostvm"
while read line
do
  if [[ "$line" == *"$SUB"* ]]; then
    hostvm=${line#*=}
  fi
done < .env

ssh  root@$hostvm;