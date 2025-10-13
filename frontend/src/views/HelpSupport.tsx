import React from 'react';
import ButtonPrimary from '../components/ButtonPrimary';
import Panel from '../components/Panel';

const HelpSupport: React.FC = () => {
  return (
    <div className="max-w-lg mx-auto mt-10">
      <Panel>
        <h1 className="text-2xl font-bold mb-6">Help | Support</h1>
        <p className="text-text-dim">Use the dispute flow on each order for delivery issues.</p>
        <p className="text-text-dim mt-2">For general help, contact support.</p>
        <div className="mt-6">
          <a href="mailto:support@zeta.global">
            <ButtonPrimary>Open support</ButtonPrimary>
          </a>
        </div>
      </Panel>
    </div>
  );
};

export default HelpSupport;
