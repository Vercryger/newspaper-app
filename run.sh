#!/bin/bash

clear
if [ ! -d node_modules ]; then
  echo "******************** COLLECTING DEPENDENCIES *******************"
  npm install
fi;

if [ $# -eq 1 ] && [ $1 = 'monitor' ]; then
  echo "*********************** MONITORING SERVER ***********************"
  nodemon bin/www 
else 
  echo "************************* RUNNING SERVER ************************"
  DEBUG=app bin/www
fi;