import React from 'react';
import { useTahlilStore } from '../../../store/useTahlilStore';
import { ExamCatalogView } from './ExamCatalogView';
import { RapidKeypadView } from './RapidKeypadView';
import { QuestionJournalView } from './QuestionJournalView';
import { AnalyticsDashboardView } from './AnalyticsDashboardView';

export const TahlilHub: React.FC = () => {
  const { activeView, activePhase } = useTahlilStore();

  const currentView = activeView || (
    activePhase === 'phase1' ? 'keypad' :
    activePhase === 'phase2' ? 'journal' :
    activePhase === 'report' ? 'dashboard' : 'catalog'
  );

  const renderActiveView = () => {
    switch (currentView) {
      case 'catalog':
        return <ExamCatalogView />;
      case 'keypad':
        return <RapidKeypadView />;
      case 'journal':
        return <QuestionJournalView />;
      case 'dashboard':
        return <AnalyticsDashboardView />;
      default:
        return <ExamCatalogView />;
    }
  };

  return (
    <div className="w-full flex-1 pt-14 pb-16 flex flex-col items-center">
      {renderActiveView()}
    </div>
  );
};

export default TahlilHub;
