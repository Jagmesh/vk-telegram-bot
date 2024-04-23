FROM node:20

RUN apt-get update -y
RUN apt-get upgrade -y
RUN apt-get install ffmpeg -y

WORKDIR /app

COPY . /app

EXPOSE 1337

CMD ["npm", "run", "start:prod"]