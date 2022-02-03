import {ModuleInstance} from "./ModuleInstance";
import {MqttRouter} from "./MqttRouter";

export type bindingDataListener = (data: any, time: number, id: ModuleInstance, binding: InstanceBinding) => void;

/**
 * Helper class to manage module instance bindings.
 */
export class InstanceBinding {
    private readonly _router: MqttRouter;
    private readonly _instance: ModuleInstance;

    private readonly _mqttListener;
    private readonly _channel;
    private readonly _dataListener;

    constructor(instance: ModuleInstance, router: MqttRouter, dataListener: bindingDataListener) {
        this.unbind = this.unbind.bind(this);
        this.dataListenerWrapper = this.dataListenerWrapper.bind(this);

        this._instance = instance;
        this._router = router;

        this._dataListener = dataListener;

        this._mqttListener = instance.feedRaw;
        this._channel = `car/${instance.id()}/raw`;

        router.on(this._channel, this._mqttListener);
        instance.on("data", this.dataListenerWrapper);

    }

    public uuid() {
        return this._instance.uuid();
    }

    private dataListenerWrapper(data: any, timestamp: number) {
        this._dataListener(data, timestamp, this._instance, this);
    }

    unbind() {
        this._router.off(this._channel, this._mqttListener);
        this._instance.off("data", this.dataListenerWrapper);
    }
}
