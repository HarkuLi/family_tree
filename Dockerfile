FROM node:6

RUN npm install -g -y nodemon
RUN mkdir /family_tree

WORKDIR /family_tree
CMD ["npm", "run", "start"]
EXPOSE 5000
