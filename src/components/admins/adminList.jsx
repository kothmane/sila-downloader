import AdminCard from "./adminCard";


export default function AdminList({ admins }) {

  if (!admins) return <div>No admins</div>;

  return (
    <div className="flex flex-col gap-4">
      {admins.map((admin) => (
        <AdminCard key={admin._id} admin={admin} />
      ))}
    </div>
  );
}