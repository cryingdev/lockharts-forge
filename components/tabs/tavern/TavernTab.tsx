
import React from 'react';
import { useTavern } from './hooks/useTavern';
import { TavernListView } from './ui/TavernListView';
import { TavernInteractionView } from './ui/TavernInteractionView';

const TavernTab = () => {
    const tavern = useTavern();
    const { 
        selectedMercenary, 
        groupedMercs, 
        handlers 
    } = tavern;

    if (selectedMercenary) {
        return (
            <TavernInteractionView 
                mercenary={selectedMercenary} 
                onBack={handlers.handleCloseInteraction} 
            />
        );
    }

    return (
        <TavernListView 
            hired={groupedMercs.hired}
            visitors={groupedMercs.visitors}
            onScout={handlers.handleScout}
            onSelect={handlers.handleSelectMercenary}
        />
    );
};

export default TavernTab;
