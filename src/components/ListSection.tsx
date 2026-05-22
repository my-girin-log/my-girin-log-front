export type ListItem = {
  id: string;
  title: string;
  body: string;
  onClick: () => void;
};

export function ListSection({
  title,
  items,
  emptyMessage,
}: {
  title: string;
  items: ListItem[];
  emptyMessage?: string;
}) {
  return (
    <section className="listSection">
      <div className="sectionTitle">
        <h2>{title}</h2>
      </div>
      {items.length === 0 && emptyMessage ? (
        <p className="listEmpty">{emptyMessage}</p>
      ) : null}
      {items.map((item) => (
        <button className="listCard" key={item.id} onClick={item.onClick}>
          <strong>{item.title}</strong>
          <span>{item.body}</span>
        </button>
      ))}
    </section>
  );
}
