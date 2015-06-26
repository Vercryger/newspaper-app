#!/bin/bash

clear
if [ ! -d node_modules ]; then
  echo "******************** COLLECTING DEPENDENCIES *******************"
  npm install
fi;

if [ $1 = 'monitor' ]; then
  echo "*********************** MONITORING SERVER ***********************"
  nodemon bin/www 
else 
  echo "************************* RUNNING SERVER ************************"
  DEBUG=app bin/www
fi;