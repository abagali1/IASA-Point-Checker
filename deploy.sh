#!/bin/bash

date=`date +%Y.%m.%d_%H.%M.%S`
git tag "deploy-${date}" 
git push origin --tags
