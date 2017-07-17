FROM node:6

ENV NODE_ENV=production
RUN groupadd -r app && useradd -r -g app app

COPY . /opt/app
WORKDIR /
RUN npm i --silent

EXPOSE 10010
USER app

CMD ["node", "/opt/app/app.js"]
