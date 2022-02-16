FROM node:14

ENV TZ America/New_York

RUN  ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone \
     && DEBIAN_FRONTEND=noninteractive \
     && apt-get update \
     && apt-get install -y wget gnupg ca-certificates procps libxss1 \
     && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install 

COPY . .

EXPOSE 3000

ENTRYPOINT ["node", "app.js"]
