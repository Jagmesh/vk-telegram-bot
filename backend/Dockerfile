FROM node:20

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y

RUN apt-get install -y python3
RUN apt-get install -y python3-pip

RUN apt install -y yt-dlp

WORKDIR /app

COPY . /app

EXPOSE 1337

CMD ["npm", "run", "start:prod"]