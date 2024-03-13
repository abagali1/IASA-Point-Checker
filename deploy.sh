#!/bin/bash

confirm() {

    last_commit=`git log -1 --oneline --pretty=format:%h | \cat`
    # call with a prompt string or use a default
    read -r -p "${1:-Deploy last published commit ($last_commit)? [y/N]} " response
    case "$response" in
        [yY][eE][sS]|[yY]) 
            true
            ;;
        *)
            exit 1;
            ;;
    esac
}

UNSTAGED_UNCOMMITTED=`git status --porcelain=v1 | wc -l`

if [[ $UNSTAGED_UNCOMMITTED ]]; then
    echo "You have unstaged or uncommitted changes."
    confirm
fi

date=`date +%Y.%m.%d_%H.%M.%S`
git tag "deploy-${date}" 
git push origin --tags
