import {MqttClient} from "mqtt";
import EventEmitter from "events";
import {IPublishPacket} from "mqtt-packet";
import {IClientPublishOptions} from "mqtt/types/lib/client-options";
import {PacketCallback} from "mqtt/types/lib/client";
import {logger} from "../Util/logging";

const log = logger("MqttRouter");

/**
 * Routes MQTT messages such that individual topics are subscribable.
 * TODO: Wrap other eventemitter methods (off - need to unsub)
 */
export class MqttRouter extends EventEmitter {
    private readonly _mqtt: MqttClient;

    constructor(mqtt: MqttClient) {
        super();
        this._mqtt = mqtt;
        this._mqtt.on("message", this.onMqttMessage.bind(this));
    }

    /**
     * Subscribe to events from the passed MQTT channel.
     * @param channel - The MQTT Channel to subscribe to.
     * @param listener
     */
    on(channel: string, listener: (...args: any[]) => void): this {
        log(`Subscribing >${channel}<`)

        // If the channel hasn't been subbed to yet, do it so we start receiving its events.
        if (!this.eventNames().includes(channel))
            this._mqtt.subscribe(channel);

        super.on(channel, listener);
        return this;
    }

    public publish(topic: string, message: string | Buffer, opts?: IClientPublishOptions, callback?: PacketCallback): this {
        this._mqtt.publish(topic, message, opts ?? {}, callback);
        return this;
    }


    private onMqttMessage(topic: string, payload: Buffer, packet: IPublishPacket) {
        this.emit(topic, payload, packet);
    }
}
