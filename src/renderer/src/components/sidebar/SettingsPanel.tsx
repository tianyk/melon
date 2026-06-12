import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { melon } from '@/lib/melon-sdk';

export function SettingsPanel({ onClose }: { onClose: () => void }) {
	const { state, dispatch } = useAppContext();
	const { settings } = state.settings;
	const [apiKeyInput, setApiKeyInput] = useState('');

	const handleThemeChange = (theme: 'light' | 'dark') => {
		dispatch({ domain: 'settings', action: { type: 'UPDATE_SETTINGS', partial: { theme } } });
		void melon.setSettings({ theme });
	};

	const handleSaveApiKey = () => {
		if (apiKeyInput.trim()) {
			void melon.setSettings({ apiKeyConfigured: true });
			dispatch({
				domain: 'settings',
				action: { type: 'UPDATE_SETTINGS', partial: { apiKeyConfigured: true } },
			});
			setApiKeyInput('');
		}
	};

	return (
		<div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
			<div
				className="absolute right-0 top-0 h-full w-80 bg-card border-l border-border p-6 shadow-lg overflow-y-auto"
				onClick={e => e.stopPropagation()}
			>
				<h2 className="text-lg font-semibold mb-6">设置</h2>

				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">API 密钥</h3>
					<div className="flex gap-2 mb-2">
						<Input
							type="password"
							placeholder={settings.apiKeyConfigured ? '●●●●●●●●●●●●●●●●●●' : '输入 API Key'}
							value={apiKeyInput}
							onChange={e => setApiKeyInput(e.target.value)}
							className="text-sm"
						/>
						<Button size="sm" onClick={handleSaveApiKey} disabled={!apiKeyInput.trim()}>
							保存
						</Button>
					</div>
					<p className="text-xs text-muted-foreground">
						状态：{settings.apiKeyConfigured ? '✅ 已配置' : '❌ 未配置'}
					</p>
				</div>

				<Separator className="my-4" />

				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">外观</h3>
					<div className="flex gap-2">
						<Button
							variant={settings.theme === 'light' ? 'default' : 'outline'}
							size="sm"
							onClick={() => handleThemeChange('light')}
						>
							浅色
						</Button>
						<Button
							variant={settings.theme === 'dark' ? 'default' : 'outline'}
							size="sm"
							onClick={() => handleThemeChange('dark')}
						>
							深色
						</Button>
					</div>
				</div>

				<Separator className="my-4" />

				<div className="mb-6">
					<h3 className="text-sm font-medium mb-2">模型</h3>
					<Input value={settings.model} disabled className="text-sm" />
				</div>

				<Separator className="my-4" />

				<div>
					<h3 className="text-sm font-medium mb-2">语言</h3>
					<p className="text-sm text-muted-foreground">{settings.language === 'zh-CN' ? '简体中文' : 'English'}</p>
				</div>
			</div>
		</div>
	);
}
