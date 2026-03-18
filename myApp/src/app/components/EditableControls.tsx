import { useState } from 'react';

interface EditableControlsProps {
  onConfigChange: (config: DesignConfig) => void;
  onPlayPrototype?: () => void;
  isPrototypeMode?: boolean;
}

export interface DesignConfig {
  heading: string;
  placeholder: string;
  button1Label: string;
  button2Label: string;
  iconBgColors: {
    from: string;
    via: string;
    to: string;
  };
  buttonBorderColor: string;
  inputBgColor: string;
}

export function EditableControls({ onConfigChange, onPlayPrototype, isPrototypeMode }: EditableControlsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DesignConfig>({
    heading: 'What are we learning today?',
    placeholder: 'Type your question or paste your problem here...',
    button1Label: 'Generate Full Solution',
    button2Label: 'Generate Scaffolded Solution',
    iconBgColors: {
      from: 'purple-500',
      via: 'pink-500',
      to: 'orange-400',
    },
    buttonBorderColor: 'gray-300',
    inputBgColor: '#f0f0f0',
  });

  const handleChange = (key: keyof DesignConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  const handleColorChange = (position: keyof DesignConfig['iconBgColors'], value: string) => {
    const newConfig = {
      ...config,
      iconBgColors: { ...config.iconBgColors, [position]: value },
    };
    setConfig(newConfig);
    onConfigChange(newConfig);
  };

  // Don't render in prototype mode
  if (isPrototypeMode) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="flex gap-2 items-center">
        {onPlayPrototype && (
          <button
            onClick={onPlayPrototype}
            className="px-4 py-2 rounded-lg shadow-lg transition-colors font-medium bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
          >
            ▶️ Play
          </button>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        >
          {isOpen ? 'Close Editor' : 'Edit Design'}
        </button>
      </div>

      {isOpen && (
        <div className="mt-2 bg-white rounded-lg shadow-2xl p-6 w-80 max-h-[600px] overflow-y-auto">
          <h3 className="font-semibold mb-4 text-lg">Design Editor</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Heading</label>
              <input
                type="text"
                value={config.heading}
                onChange={(e) => handleChange('heading', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Input Placeholder</label>
              <input
                type="text"
                value={config.placeholder}
                onChange={(e) => handleChange('placeholder', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Button 1 Label</label>
              <input
                type="text"
                value={config.button1Label}
                onChange={(e) => handleChange('button1Label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Button 2 Label</label>
              <input
                type="text"
                value={config.button2Label}
                onChange={(e) => handleChange('button2Label', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Icon Gradient Colors</label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">From</label>
                  <select
                    value={config.iconBgColors.from}
                    onChange={(e) => handleColorChange('from', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="purple-500">Purple</option>
                    <option value="blue-500">Blue</option>
                    <option value="red-500">Red</option>
                    <option value="green-500">Green</option>
                    <option value="yellow-500">Yellow</option>
                    <option value="indigo-500">Indigo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Via</label>
                  <select
                    value={config.iconBgColors.via}
                    onChange={(e) => handleColorChange('via', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="pink-500">Pink</option>
                    <option value="purple-500">Purple</option>
                    <option value="blue-500">Blue</option>
                    <option value="red-500">Red</option>
                    <option value="green-500">Green</option>
                    <option value="yellow-500">Yellow</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">To</label>
                  <select
                    value={config.iconBgColors.to}
                    onChange={(e) => handleColorChange('to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="orange-400">Orange</option>
                    <option value="yellow-400">Yellow</option>
                    <option value="red-400">Red</option>
                    <option value="pink-400">Pink</option>
                    <option value="purple-400">Purple</option>
                    <option value="blue-400">Blue</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Input Background Color</label>
              <input
                type="color"
                value={config.inputBgColor}
                onChange={(e) => handleChange('inputBgColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
