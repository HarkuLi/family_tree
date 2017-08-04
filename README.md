# Family Tree Service
A simple web service which you can record your family with. 

## Features introduction

### tree

You can build your family tree with graphically operating and edit every people in your family. Each person has his/her detail information and dialogs which can used by linebot for imitating talking pattern. 

### linebot

What you need to do is input the pattern-response mapping and enable dialog of the person. And then add the linebot to your family line group. And the bot will respond based on your family dialog database.

### mail service

Allow you to send emails to groups which can be created customized or people. So you can hold family activities and notify your family members conveniently.

### QRcode

Getting the QRcode of your family tree URL, so you can get your tree with cellphone easily.

### import and export

Export your family data and download it for backup.

## Get started

### Environment variables

* used in code by process.env.[VARIABLE_NAME]

#### Required

GMAIL_USER: user of google accout

GMAIL_KEY: password of google account

GOOGLE_API_KEY: for shortenUrl API

TREE_FILE_EXCHANGE_IV: for encrypting exported data by AES

TREE_FILE_EXCHANGE_KEY: for encrypting exported data by AES

#### Not required if running locally

DB_URL: URL of remote db ex: mongodb://mydb.xxx.xxx:27017/

USER_FT: user name of familytree db account

PWD_FT: password of familytree db account

USER_LB: user name of linebot db account

PWD_LB: password of linebot db account

### Steps for run loaclly

The following commands use docker, so please ensure that you have installed docker in your computer.

* [docker](https://www.docker.com/)

first, clone this repository

    git clone https://github.com/HarkuLi/family_tree.git
    cd family_tree
    
create a volume to saving data of mongodb
    
    npm run create-vol
    
build docker image by Dockerfile

    npm run build-dev
    
if you don't have mongo image, run this

    docker pull mongo
    
then, run mongodb in docker

    npm run mongo-docker

start the server

    npm run start-dev-docker

now, you can access your server on [localhost:5000](http://localhost:5000)

## Linebot

go to the repository of [linebot](https://github.com/HarkuLi/family-tree-linebot) to see more detail

## Project detail

* [google doc](https://docs.google.com/document/d/10L52n5J54-Tds4jL721LofZ8IoGtpFYYIdubO3CgWT0/edit?ts=596c70a8)
