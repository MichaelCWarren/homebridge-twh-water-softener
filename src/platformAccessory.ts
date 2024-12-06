import type { PlatformAccessory, Service } from "homebridge"

import type { TWHHomebridgePlatform } from "./platform.js"
/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class WaterSoftenerAccessory {
    private service: Service

    /**
     * These are just used to create a working example
     * You should implement your own code to track the state of your accessory
     */
    constructor(private readonly platform: TWHHomebridgePlatform, private readonly accessory: PlatformAccessory) {
        // set accessory information
        this.accessory
            .getService(this.platform.Service.AccessoryInformation)!
            .setCharacteristic(this.platform.Characteristic.Manufacturer, "EcoPure")
            .setCharacteristic(this.platform.Characteristic.Model, "EP42")
            .setCharacteristic(this.platform.Characteristic.SerialNumber, "3172944497")

        // you can create multiple services for each accessory
        this.service = this.accessory.getService(this.platform.Service.FilterMaintenance) || this.accessory.addService(this.platform.Service.FilterMaintenance)
        this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.displayName)

        const regenService = this.accessory.getService(this.platform.Service.Switch) || this.accessory.addService(this.platform.Service.Switch)
        regenService.setCharacteristic(this.platform.Characteristic.Name, "Regeneration")

        const saltLevelService = this.accessory.getService(this.platform.Service.Battery) || this.accessory.addService(this.platform.Service.Battery)
        saltLevelService.setCharacteristic(this.platform.Characteristic.Name, "Salt Level")

        // each service must implement at-minimum the "required characteristics" for the given service type
        // see https://developers.homebridge.io/#/service/Lightbulb

        /**
         * Updating characteristics values asynchronously.
         *
         * Example showing how to update the state of a Characteristic asynchronously instead
         * of using the `on('get')` handlers.
         * Here we change update the motion sensor trigger states on and off every 10 seconds
         * the `updateCharacteristic` method.
         *
         */
        setInterval(() => {
            const response = fetch("http://192.168.4.58/data")
                .then((response) => response.json())
                .then((data) => {
                    const lowSalt = data.salt_increment <= 2
                    this.service.updateCharacteristic(this.platform.Characteristic.FilterLifeLevel, data.salt_percentage * 100)
                    this.service.updateCharacteristic(this.platform.Characteristic.FilterChangeIndication, lowSalt ? this.platform.Characteristic.FilterChangeIndication.CHANGE_FILTER : this.platform.Characteristic.FilterChangeIndication.FILTER_OK)
                    regenService.setCharacteristic(this.platform.Characteristic.On, data.mode == 1)
                    saltLevelService.setCharacteristic(this.platform.Characteristic.BatteryLevel, data.salt_percentage * 100)
                    saltLevelService.setCharacteristic(this.platform.Characteristic.StatusLowBattery, lowSalt ? this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW : this.platform.Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL)

                    this.platform.log.info("Updated Filter Characteristics:", data.salt_percentage * 100, data.salt_increment)
                })
        }, 10000)
    }
}
