FROM python:3.9

RUN mkdir /usr/src/app
WORKDIR /usr/src/app
COPY . .
RUN pip3 install -r requirements.txt

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get update \
    && apt-get install -y --no-install-recommends gettext nodejs apt-utils
RUN apt-get install -f
RUN apt install -y wget curl unzip
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt install -y fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libatspi2.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 libnspr4 libnss3 libu2f-udev libvulkan1 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2 xdg-utils
RUN dpkg -i google-chrome-stable_current_amd64.deb


RUN cd utils/github_calendar && npm install
RUN npm install uglifycss -g
RUN uglifycss static/css/tailwind.clean.css > static/css/tailwind.output.css \
    && uglifycss static/css/tech_stack.css > static/css/tech_stack.output.css \
    && uglifycss static/css/profile.css > static/css/profile.output.css

RUN apt-get clean \
    && rm -rf /var/lib/apt/lists/*

CMD ["python3", "-m", "gunicorn", "--bind", ":8000", "--workers", "2", "config.wsgi:application"]
