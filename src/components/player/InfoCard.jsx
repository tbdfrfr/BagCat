import { resolveAssetUrl } from '../../utils/assetUrl';

const InfoCard = ({ app }) => {
  const appName = app?.appName || 'Unknown App';

  return (
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={resolveAssetUrl(app?.icon)}
        alt={appName}
        draggable="false"
        className="h-10 w-10 rounded-lg object-cover border border-white/20 bg-[#0e1726]"
      />
      <div className="min-w-0">
        <p className="font-semibold leading-tight truncate">{appName}</p>
      </div>
    </div>
  );
};

export default InfoCard;
