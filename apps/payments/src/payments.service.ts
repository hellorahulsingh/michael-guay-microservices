import { Inject, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { ConfigService } from "@nestjs/config";
import { CreateChargeDto, NOTIFICATIONS_SERVICE } from "@app/common";
import { ClientProxy } from "@nestjs/microservices";
import { PaymentsCreateChargeDto } from "./dto/payments-create-charge.dto";

@Injectable()
export class PaymentsService {
	constructor(
		private readonly configService: ConfigService,
		@Inject(NOTIFICATIONS_SERVICE) private readonly notificationsService: ClientProxy
	) {
	}

	private readonly stripe = new Stripe(
		this.configService.get('STRIPE_SECRET_KEY'),
		{
			apiVersion: '2023-10-16'
		}
	);

	async createCharge({ email, card, amount }: PaymentsCreateChargeDto) {
		const paymentMethod = await this.stripe.paymentMethods.create({
			type: 'card',
			card
		});

		const paymentIntent = await this.stripe.paymentIntents.create({
			payment_method: paymentMethod.id,
			// takes cents
			amount: amount * 100,
			// immediately charge user
			confirm: true,
			payment_method_types: ['card'],
			currency: 'usd',
		});

		this.notificationsService.emit('notify_email', { email, text: `Your payment of $${amount} has completed successfully` });

		// // if not working remove paymentMethod and use this paymentIntent
		// const paymentIntent = await this.stripe.paymentIntents.create({
		// 	payment_method: 'pm_card_visa'
		// //	takes cents
		// amount: amount * 100,
		// //	immediately charge user
		// confirm: true,
		// currency: 'usd',
		// });

		return paymentIntent;
	}
}
