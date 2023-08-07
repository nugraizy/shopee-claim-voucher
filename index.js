const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

const vouchers = xlsx.readFile('Shopee Voucher 8.8.xlsx').Strings.map((v) => v.t);

const phoneNumber = '';
const password = '';

(async () => {
	const browser = await puppeteer.launch({
		headless: false,
		args: ['--enable-features=NetworkService', '--no-sandbox'],
		ignoreHTTPSErrors: true
	});

	const page = await browser.newPage();

	await page.goto('https://shopee.co.id/buyer/login?next=https://shopee.co.id/user/voucher-wallet', {
		waitUntil: 'networkidle2'
	});

	await page.type('input[placeholder="No. Handphone/Username/Email"]', phoneNumber, {
		delay: 100
	});
	await page.type('input[placeholder="Password"]', password, {
		delay: 100
	});

	await page.evaluate(async (text) => {
		const buttons = [...document.querySelectorAll('button')];
		const button = buttons.find((button) => button.textContent === text);
		button.click();
	}, 'Log in');

	await page.waitForNavigation({ waitUntil: 'networkidle0' });

	await page.goto('https://shopee.co.id/user/voucher-wallet', {
		waitUntil: 'networkidle2'
	});

	for (const voucher of vouchers) {
		await page.evaluate(() => {
			const input = document.querySelector('input[placeholder="Masukkan kode voucher"]');
			input.value = '';
		});

		await page.type('input[placeholder="Masukkan kode voucher"]', voucher, {
			delay: 80
		});

		await page.evaluate(async (text) => {
			const buttons = [...document.querySelectorAll('button')];
			const button = buttons.find((button) => button.textContent === text);
			button.click();
		}, 'Simpan');

		const error = await page.evaluate(() => {
			const error =
				document.querySelector('.input-with-validator__error-message') || document.querySelector('.stardust-toast__text');

			return error
				? error.innerHTML === 'Voucher Berhasil Disimpan'
					? null
					: error.innerHTML === 'Kamu sudah pernah klaim voucher ini.'
					? 'Already Claimed'
					: 'Invalid Code'
				: null;
		});

		if (error) {
			console.log(voucher, '\x1b[31m' + error + '\x1b[0m');
		} else {
			console.log(voucher, '\x1b[32mSuccess\x1b[0m');
		}
	}
})();
