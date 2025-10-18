"use client";

interface SlashCommandExamplesProps {
  className?: string;
}

export default function SlashCommandExamples({ className = '' }: SlashCommandExamplesProps) {
  const examples = [
    {
      command: '/todo',
      description: 'Tạo todo mới',
      example: '/todo Họp team lúc 2h chiều mai',
      color: 'text-blue-600'
    },
    {
      command: '/search',
      description: 'Tìm kiếm todos',
      example: '/search tìm todos về học tập',
      color: 'text-green-600'
    },
    {
      command: '/schedule',
      description: 'Xem lịch trình',
      example: '/schedule xem lịch tuần này',
      color: 'text-purple-600'
    },
    {
      command: '/tags',
      description: 'Gán tags tự động',
      example: '/tags gán tags cho todo "Mua sắm"',
      color: 'text-orange-600'
    },
    {
      command: '/availability',
      description: 'Kiểm tra thời gian rảnh',
      example: '/availability kiểm tra thời gian rảnh ngày mai',
      color: 'text-red-600'
    },
    {
      command: '/update',
      description: 'Cập nhật todo',
      example: '/update hoàn thành todo "Đọc sách"',
      color: 'text-indigo-600'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <h3 className="text-lg font-semibold text-gray-900">Slash Commands Examples</h3>
      </div>
      
      <div className="space-y-4">
        {examples.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start gap-3">
              <div className={`font-mono text-sm font-bold ${item.color}`}>
                {item.command}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  {item.description}
                </div>
                <div className="text-xs text-gray-600 bg-gray-100 rounded px-2 py-1 font-mono">
                  {item.example}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-sm text-blue-800">
          <strong>💡 Tip:</strong> Gõ <code className="bg-blue-100 px-1 rounded">/</code> trong chat để xem danh sách commands và gợi ý!
        </div>
      </div>
    </div>
  );
}
