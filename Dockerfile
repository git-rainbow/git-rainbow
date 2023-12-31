FROM python:3.9
RUN ln -snf /usr/share/zoneinfo/Asia/Seoul /etc/localtime
RUN mkdir /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN mkdir media
RUN pip3 install -r requirements.txt

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -
RUN echo "deb https://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list
RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext nodejs apt-utils google-chrome-stable

RUN cd utils/github_calendar && npm install
RUN npm install uglifycss -g
RUN uglifycss static/css/tailwind.clean.css > static/css/tailwind.output.css \
    && uglifycss static/css/tech_stack.css > static/css/tech_stack.output.css \
    && uglifycss static/css/profile.css > static/css/profile.output.css

RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN django-admin compilemessages

RUN python3 ./utils/github_calendar_colors/img2base64.py

CMD ["python3", "-m", "gunicorn", "--bind", ":8000", "--workers", "2", "config.wsgi:application"]
