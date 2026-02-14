import Search from '../SearchContainer';
import QuickLinks from '../QuickLinks';

import { process } from '/src/utils/hooks/loader/utils';

const NewTab = ({ id, updateFn }) => {
  const navigating = {
    id: id,
    go: updateFn,
    process: process,
  };
  return (
    <div className="h-[calc(100%-100px)] flex flex-col items-center justify-center p-6 gap-8">
      <div className="w-full max-w-2xl">
        <Search nav={false} logo={false} cls="-mt-3 absolute z-50" navigating={navigating} />
        <QuickLinks cls="mt-16" nav={false} navigating={navigating} />
      </div>
    </div>
  );
};

export default NewTab;
