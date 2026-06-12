module.exports = {
	appId: 'com.melon.app',
	productName: '西瓜',
	directories: {
		output: 'dist'
	},
	files: [
		'out/**/*'
	],
	mac: {
		target: ['dmg'],
		icon: 'resources/icon.png',
		artifactName: '${productName}-${version}.${ext}'
	},
	win: {
		target: ['nsis'],
		icon: 'resources/icon.png'
	}
};
