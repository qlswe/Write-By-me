import React, { useEffect, useState } from 'react';
import { BookOpen, Shield, Search, FileText, Settings, HelpCircle, Key, ChevronRight } from 'lucide-react';

interface DisguisePageProps {
  onDeactivate: () => void;
}

export function DisguisePage({ onDeactivate }: DisguisePageProps) {
  const [typedChars, setTypedChars] = useState('');
  const [clickCount, setClickCount] = useState(0);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const char = e.key.toLowerCase();
      const newChars = (typedChars + char).slice(-10);
      setTypedChars(newChars);
      
      if (newChars.includes('aha')) {
        onDeactivate();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [typedChars, onDeactivate]);

  const handleTitleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 3) {
      onDeactivate();
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#333333] font-sans antialiased text-sm">
      {/* State / Federation Banner */}
      <div className="bg-[#1e293b] text-white py-2 px-6 border-b border-gray-300 text-xs flex justify-between items-center font-mono">
        <div className="flex items-center gap-2">
          <Shield size={14} className="text-blue-400" />
          <span>ФЕДЕРАЛЬНЫЙ ПОРТАЛ ГОСУДАРСТВЕННЫХ СТАНДАРТОВ И ТЕХНИЧЕСКИХ РЕГЛАМЕНТОВ</span>
        </div>
        <div className="text-gray-400">Версия базы данных: 4.8.19 (Обновлено: вчера)</div>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-gray-300 shadow-sm py-4 px-6 md:px-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#2563eb] text-white flex items-center justify-center font-black rounded-lg text-lg shadow-inner">
            Г
          </div>
          <div>
            <h1 
              onClick={handleTitleClick}
              className="text-lg font-bold text-gray-800 cursor-default select-none hover:text-blue-600 transition-colors"
              title="Нажмите 3 раза для деактивации маскировки"
            >
              РосСтандартДок
            </h1>
            <p className="text-xs text-gray-500">Межгосударственные стандарты СНГ и технические спецификации</p>
          </div>
        </div>
        <div className="relative max-w-md w-full md:w-80">
          <input 
            type="text" 
            placeholder="Поиск стандартов по номеру или названию..." 
            className="w-full pl-9 pr-4 py-1.5 bg-gray-50 border border-gray-300 rounded-md text-xs focus:outline-none focus:border-blue-500 transition-all text-black"
            disabled
          />
          <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <h3 className="font-bold text-gray-700 border-b border-gray-100 pb-2 mb-3 uppercase text-xs tracking-wider flex items-center gap-1.5">
              <BookOpen size={14} className="text-blue-600" />
              Категории ГОСТ
            </h3>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 cursor-not-allowed">
                <span>01. Общие положения</span>
                <ChevronRight size={12} className="text-gray-400" />
              </li>
              <li className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 bg-blue-50/50 text-blue-700 font-medium cursor-default">
                <span>12. Системы стандартов безопасности труда</span>
                <ChevronRight size={12} className="text-blue-500" />
              </li>
              <li className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 cursor-not-allowed">
                <span>19. Единая система программной документации</span>
                <ChevronRight size={12} className="text-gray-400" />
              </li>
              <li className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 cursor-not-allowed">
                <span>34. Информационная технология</span>
                <ChevronRight size={12} className="text-gray-400" />
              </li>
              <li className="flex items-center justify-between p-1.5 rounded hover:bg-gray-50 cursor-not-allowed">
                <span>91. Строительные материалы и технологии</span>
                <ChevronRight size={12} className="text-gray-400" />
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm text-xs space-y-3">
            <h3 className="font-bold text-gray-700 border-b border-gray-100 pb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-600" />
              Карточка документа
            </h3>
            <div className="space-y-2 text-gray-600">
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Обозначение</span>
                <span className="font-mono font-bold text-gray-800">ГОСТ 12.0.004-2015</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Статус</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">Действующий</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Дата введения</span>
                <span className="font-medium text-gray-800">01.03.2017</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Разработчик</span>
                <span className="text-gray-800">ФГУП «СТАНДАРТИНФОРМ»</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px] uppercase">Количество страниц</span>
                <span className="text-gray-800">42 стр.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Content View */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8 shadow-sm space-y-6">
            
            <div className="border-b border-gray-200 pb-6 text-center space-y-2">
              <p className="text-xs font-mono text-gray-500 uppercase tracking-widest">МЕЖГОСУДАРСТВЕННЫЙ СТАНДАРТ</p>
              <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight leading-snug">
                ГОСТ 12.0.004-2015
              </h2>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide max-w-2xl mx-auto">
                Система стандартов безопасности труда. Организация обучения безопасности труда. Общие положения.
              </p>
              <p className="text-xs italic text-gray-500">
                Occupational safety standards system. Training organization on occupational safety. General provisions
              </p>
            </div>

            <div className="space-y-6 text-[#222222] leading-relaxed text-sm font-serif">
              <div>
                <h4 className="font-bold text-gray-800 font-sans text-sm uppercase tracking-wider mb-2">1. Область применения</h4>
                <p>
                  Настоящий стандарт устанавливает основные положения и требования к организации обучения безопасности труда (охране труда) лиц, занятых трудовой деятельностью. Стандарт распространяется на всех работодателей (юридических и физических лиц), независимо от их организационно-правовых форм и форм собственности, осуществляющих любые виды экономической деятельности на территории государств-участников СНГ.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 font-sans text-sm uppercase tracking-wider mb-2">2. Нормативные ссылки</h4>
                <p>
                  В настоящем стандарте использованы нормативные ссылки на межгосударственные стандарты и классификаторы, обеспечивающие соблюдение гигиенических нормативов, условий хранения и стандартизированных технических требований к защитному оборудованию на производстве.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 font-sans text-sm uppercase tracking-wider mb-2">3. Термины, определения и сокращения</h4>
                <p>
                  Для целей настоящего стандарта применены соответствующие термины с соответствующими им определениями в области охраны труда, промышленной санитарии и техники безопасности, установленные национальным законодательством стран СНГ.
                </p>
                <p className="mt-2">
                  <strong className="font-sans text-xs uppercase tracking-wider text-gray-600">3.1. Безопасность труда:</strong> Состояние условий труда, при котором исключено воздействие на работающих опасных и вредных производственных факторов или уровень их воздействия не превышает установленных нормативов.
                </p>
              </div>

              <div className="bg-gray-50 border-l-4 border-blue-500 p-4 font-sans text-xs text-gray-600 rounded-r-md">
                <p className="font-bold text-gray-800 mb-1">ОБРАТИТЕ ВНИМАНИЕ:</p>
                <p>
                  Данный интерфейс активирован в рамках встроенного протокола конспирации (маскировки) Министерства Ахахи. Чтобы полностью разблокировать систему и вернуться на главный секретный портал Министерства, совершите одно из следующих действий:
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 font-semibold text-blue-700">
                  <li>Наберите на клавиатуре секретное слово: <span className="font-mono bg-blue-100 px-1 py-0.5 rounded text-xs select-all">aha</span></li>
                  <li>Или трижды кликните по заголовку сайта <strong className="cursor-pointer underline" onClick={handleTitleClick}>"РосСтандартДок"</strong> в шапке страницы.</li>
                  <li>Или нажмите на скрытую кнопку разблокировки в самом низу страницы.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-gray-800 font-sans text-sm uppercase tracking-wider mb-2">4. Общие требования к организации обучения</h4>
                <p>
                  Обучение безопасности труда носит непрерывный характер и проводится во всех образовательных организациях, осуществляющих подготовку специалистов, а также при непосредственной профессиональной подготовке рабочих кадров на предприятиях. Работодатель обязан обеспечить проведение всех необходимых инструктажей (вводный, первичный на рабочем месте, повторный, внеплановый и целевой).
                </p>
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="border-t border-gray-200 pt-6 flex justify-between text-xs text-gray-500">
              <button disabled className="px-3 py-1.5 border border-gray-200 rounded bg-gray-50 cursor-not-allowed">Предыдущая страница</button>
              <span className="py-1.5">Страница 1 из 42</span>
              <button disabled className="px-3 py-1.5 border border-gray-200 rounded bg-gray-50 cursor-not-allowed">Следующая страница</button>
            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-300 py-8 px-6 md:px-12 mt-12 text-center text-xs text-gray-500 relative">
        <p>© 2026 Федеральная база документов национальных стандартов. Все права защищены.</p>
        <p className="mt-1">Для поддержки пользователей: support@gost-standard-docs.ru</p>
        
        {/* Secret Hidden Unlock Icon */}
        <button 
          onClick={onDeactivate}
          className="mx-auto mt-6 block p-1 text-gray-200 hover:text-blue-500 transition-colors"
          title="Секретный деактиватор"
        >
          <Key size={12} />
        </button>
      </footer>
    </div>
  );
}
