FROM quantconnect/lean:latest

USER root

COPY SamsungElectroBuyAndHold.py /module/SamsungElectroBuyAndHold.py
COPY download_samsung_electro_data.py /module/download_samsung_electro_data.py
COPY config.json /module/config.json
COPY entrypoint.sh /module/entrypoint.sh

RUN chmod +x /module/entrypoint.sh \
    && mkdir -p /results

ENTRYPOINT ["/module/entrypoint.sh"]
