ARG NODE_VER
FROM node:${NODE_VER}-slim 

ENV LANG=C.UTF-8
ENV TZ=Asia/Tokyo

# 引数
ARG APP_NAME
ARG WORKDIR
ARG USER
ARG USER_ID
ARG GROUP
ARG GROUP_ID

ENV USER=$USER
ENV USER_ID=$USER_ID
ENV GROUP=$GROUP
ENV GROUP_ID=$GROUP_ID

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    default-libmysqlclient-dev \
    default-mysql-client \
    fontconfig \
    git \
    gnupg \
    gnupg2 \
    graphviz \
    jq \
    less \
    openssl \
    tzdata \
    unzip \
    vim \
    wget \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* \
    && truncate -s 0 /var/log/*log \
    && cp /usr/share/zoneinfo/Asia/Tokyo /etc/localtime \
    && echo "Asia/Tokyo" > /etc/timezone

WORKDIR $WORKDIR

# ローカル環境のIDと合わせたらいいと思う
# node:1000がデフォだったのでコメントアウト
#RUN groupadd --gid $GROUP_ID --system $USER \
#    && useradd --uid $USER_ID --gid $GROUP_ID --system --create-home $USER \
#    && chown -R $USER:$GROUP $WORKDIR

#RUN chown $USER_ID:$GROUP_ID $WORKDIR/*

USER $USER
