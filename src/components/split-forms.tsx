import { useState } from "react";
import { Text, View } from "react-native";
import { randomUUID } from "expo-crypto";
import {
  money,
  parseAmount,
  splitAmount,
  type Expense,
  type SplitMode,
  type Trip,
} from "@/lib/engine";
import { Button, Chips, Field, s } from "./split-ui";
export const categories: [string, string][] = [
  ["food", "อาหาร"],
  ["travel", "เดินทาง"],
  ["hotel", "ที่พัก"],
  ["coffee", "เครื่องดื่ม"],
  ["ticket", "กิจกรรม"],
  ["other", "อื่น ๆ"],
];
export const today = () => {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};
export function checkDate(date: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Error("กรอกวันที่จริงในรูปแบบ YYYY-MM-DD");
}
export function TripForm({ onSave }: { onSave: (t: Trip) => void }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(today());
  const [names, setNames] = useState(["", "", ""]);
  const [error, setError] = useState("");
  return (
    <>
      <Text style={s.muted}>ทริปใหญ่ มื้อเล็ก ก็หารกันได้</Text>
      <Field label="ชื่อทริป" value={name} onChange={setName} />
      <Field label="วันที่ (YYYY-MM-DD)" value={date} onChange={setDate} />
      {names.map((n, i) => (
        <View key={i} style={s.row}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Field
              label={"สมาชิกคนที่ " + (i + 1)}
              value={n}
              onChange={(v) => setNames(names.map((x, j) => (i === j ? v : x)))}
            />
          </View>
          <Button
            title="นำออก"
            secondary
            onPress={() => setNames(names.filter((_, j) => i !== j))}
          />
        </View>
      ))}
      <Button
        title="+ เพิ่มช่องสมาชิก"
        secondary
        disabled={names.length >= 50}
        onPress={() => setNames([...names, ""])}
      />
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        title="สร้างทริป"
        onPress={() => {
          try {
            checkDate(date);
            const clean = names.map((x) => x.trim()).filter(Boolean);
            if (!name.trim() || !clean.length)
              throw new Error("กรอกชื่อทริปและสมาชิกอย่างน้อย 1 คน");
            if (new Set(clean).size !== clean.length)
              throw new Error("ชื่อสมาชิกต้องไม่ซ้ำกัน");
            onSave({
              id: randomUUID(),
              name: name.trim(),
              date,
              members: clean.map((name) => ({ id: randomUUID(), name })),
              expenses: [],
              settlements: [],
            });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </>
  );
}
export function ExpenseForm({
  trip,
  expense,
  onSave,
}: {
  trip: Trip;
  expense?: Expense;
  onSave: (e: Expense) => void;
}) {
  const [name, setName] = useState(expense?.name || "");
  const [amount, setAmount] = useState(
    expense ? String(expense.amount / 100) : "",
  );
  const [date, setDate] = useState(expense?.date || today());
  const [payer, setPayer] = useState(expense?.payerId || trip.members[0].id);
  const [category, setCategory] = useState(expense?.category || "food");
  const [mode, setMode] = useState<SplitMode>(expense?.mode || "equal");
  const [ids, setIds] = useState(
    expense ? Object.keys(expense.shares) : trip.members.map((m) => m.id),
  );
  const [values, setValues] = useState<Record<string, string>>(
    expense?.inputs || {},
  );
  const [error, setError] = useState("");
  let preview: Record<string, number> | undefined;
  try {
    preview = splitAmount(parseAmount(amount), ids, mode, values);
  } catch {}
  return (
    <>
      <Field
        label="จำนวนเงิน (บาท)"
        value={amount}
        onChange={setAmount}
        decimal
      />
      <Field label="ชื่อรายการ" value={name} onChange={setName} />
      <Field label="วันที่ (YYYY-MM-DD)" value={date} onChange={setDate} />
      <Text style={s.label}>หมวดหมู่</Text>
      <Chips options={categories} value={category} onChange={setCategory} />
      <Text style={s.label}>ใครเป็นคนจ่าย?</Text>
      <Chips
        options={trip.members.map((m) => [m.id, m.name])}
        value={payer}
        onChange={setPayer}
      />
      <Text style={s.label}>หารกันแบบไหนดี?</Text>
      <Chips
        options={[
          ["equal", "เท่ากัน"],
          ["amount", "กำหนดยอด"],
          ["percent", "เปอร์เซ็นต์"],
        ]}
        value={mode}
        onChange={(v) => setMode(v as SplitMode)}
      />
      <Button
        title={
          ids.length === trip.members.length ? "ยกเลิกเลือกทุกคน" : "เลือกทุกคน"
        }
        secondary
        onPress={() =>
          setIds(
            ids.length === trip.members.length
              ? []
              : trip.members.map((m) => m.id),
          )
        }
      />
      {trip.members.map((m) => (
        <View
          key={m.id}
          style={[
            s.row,
            {
              flexWrap: "wrap",
              padding: 12,
              borderWidth: 1,
              borderColor: "#E5EBE5",
              borderRadius: 14,
              backgroundColor: "#fff",
            },
          ]}
        >
          <Button
            style={{ maxWidth: "48%" }}
            title={(ids.includes(m.id) ? "✓ " : "○ ") + m.name}
            secondary={!ids.includes(m.id)}
            onPress={() =>
              setIds(
                ids.includes(m.id)
                  ? ids.filter((id) => id !== m.id)
                  : [...ids, m.id],
              )
            }
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            {mode === "equal" ? (
              <Text style={s.text}>฿{money(preview?.[m.id] || 0)}</Text>
            ) : (
              ids.includes(m.id) && (
                <Field
                  label={m.name + (mode === "percent" ? " (%)" : " (บาท)")}
                  value={values[m.id] || ""}
                  decimal
                  onChange={(v) => setValues({ ...values, [m.id]: v })}
                />
              )
            )}
          </View>
        </View>
      ))}
      <Text style={s.muted}>
        {preview
          ? "แบ่งครบ ฿" +
            money(Object.values(preview).reduce((a, b) => a + b, 0))
          : mode === "percent"
            ? "กรอกเปอร์เซ็นต์รวมให้ครบ 100%"
            : "เลือกคนหารและกรอกยอดให้ครบ"}
      </Text>
      {!!error && (
        <Text accessibilityRole="alert" style={s.error}>
          {error}
        </Text>
      )}
      <Button
        title="บันทึกค่าใช้จ่าย"
        onPress={() => {
          try {
            checkDate(date);
            if (!name.trim()) throw new Error("กรอกชื่อรายการ");
            const cents = parseAmount(amount);
            onSave({
              id: expense?.id || randomUUID(),
              name: name.trim(),
              amount: cents,
              payerId: payer,
              category,
              date,
              mode,
              shares: splitAmount(cents, ids, mode, values),
              inputs: values,
            });
          } catch (e) {
            setError((e as Error).message);
          }
        }}
      />
    </>
  );
}
