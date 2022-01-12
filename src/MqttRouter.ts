import {connect, MqttClient} from "mqtt";
import EventEmitter from "events";
import {IPublishPacket} from "mqtt-packet";
import {IClientPublishOptions} from "mqtt/types/lib/client-options";
import {PacketCallback} from "mqtt/types/lib/client";

export class MqttRouter extends EventEmitter {
    private readonly _mqtt: MqttClient;

    constructor(mqtt: MqttClient) {
        super();

        this._mqtt = mqtt;
        this._mqtt.on("message", this.onMqttMessage.bind(this));
    }

    on(eventName: string, listener: (...args: any[]) => void): this {
        console.log(`Subscribing ${eventName}`)
        if (!this.eventNames().includes(eventName))
            this._mqtt.subscribe(eventName);

        super.on(eventName, listener);

        return this;
    }

    public publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions, callback?: PacketCallback): this {
        this._mqtt.publish(topic, message, opts ?? {}, callback);
        return this;
    }


    onMqttMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
        this.emit(topic, payload, packet);
    }
}
