const InfoCard = ({ app }) => {
  return (
    <div className="flex h-13 w-full p-2.5 py-7 items-center rounded-xl">
      <img src={app?.icon} className="w-12 h-12 rounded-md object-cover" />
      <div className="ml-4 flex flex-col gap-1">
        <p className="font-bold">{app?.appName || 'Unknown App'}</p>
        <span className="text-ellipsis">{app?.desc || 'No description available.'}</span>
      </div>
    </div>
  );
};

export default InfoCard;
