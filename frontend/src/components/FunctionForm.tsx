import { FormEvent, useMemo, useState } from "react";
import { AbiFunction, Contract, ContractTransactionResponse } from "ethers";
import { parseInputValue } from "../lib/inputs";
import { humanize } from "../lib/functions";

export interface FunctionFormProps {
  func?: AbiFunction;
  contract?: Contract;
  writeContract?: Contract;
  title?: string;
  description?: string;
  cta?: string;
  highlight?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export function FunctionForm({
  func,
  contract,
  writeContract,
  title,
  description,
  cta,
  highlight,
  disabled,
  disabledReason
}: FunctionFormProps) {
  const [inputs, setInputs] = useState<string[]>(() => func?.inputs?.map(() => "") ?? []);
  const [value, setValue] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState(false);

  const inputTypes = useMemo(() => func?.inputs ?? [], [func?.inputs]);
  const isWrite = func ? !(func.stateMutability === "view" || func.stateMutability === "pure") : false;

  if (!func || !contract) {
    return (
      <div className="action-card disabled">
        <div>
          <h3>{title ?? "Function unavailable"}</h3>
          <p className="muted">Set the deployed contract address in your environment to use this action.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (disabled || disabledReason) return;

    setError("");
    setResult("");

    try {
      const parsed = inputTypes.map((input, idx) => parseInputValue(input.type, inputs[idx] ?? ""));

      if (!isWrite) {
        const response = await (contract as any)[func.name](...parsed);
        setResult(JSON.stringify(response, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2));
        return;
      }

      if (!writeContract) {
        setError("Connect HashPack with the right permissions to send transactions.");
        return;
      }

      const overrides: Record<string, unknown> = {};
      if (func.stateMutability === "payable" && value) {
        overrides.value = BigInt(value);
      }

      setPending(true);
      const tx: ContractTransactionResponse = await (writeContract as any)[func.name](...parsed, overrides);
      const receipt = await tx.wait();
      setResult(`Transaction confirmed: ${receipt?.hash ?? tx.hash}`);
    } catch (err: any) {
      console.error(err);
      const reason = err?.error?.message || err?.data?.message || err?.message || "Unknown error";
      setError(reason);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className={`action-card ${highlight ? "highlight" : ""}`} onSubmit={handleSubmit}>
      <header className="action-head">
        <div>
          <h3>{title ?? humanize(func.name)}</h3>
          {description && <p className="muted">{description}</p>}
        </div>
        <span className={`chip ${isWrite ? "chip-write" : "chip-read"}`}>
          {isWrite ? "Update" : "View"}
        </span>
      </header>
      <div className="action-fields">
        {inputTypes.map((input, idx) => (
          <label key={input.name || idx} className="field">
            <span>{input.name ? humanize(input.name) : `Argument ${idx + 1}`}</span>
            <InputField
              type={input.type}
              value={inputs[idx] ?? ""}
              onChange={(next) =>
                setInputs((prev) => {
                  const nextInputs = [...prev];
                  nextInputs[idx] = next;
                  return nextInputs;
                })
              }
            />
            <small>{input.type}</small>
          </label>
        ))}
        {func.stateMutability === "payable" && (
          <label className="field">
            <span>Funds to send (tinybars)</span>
            <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="0" />
            <small>Sent alongside this transaction</small>
          </label>
        )}
      </div>
      {disabledReason && <p className="warning">{disabledReason}</p>}
      <div className="action-actions">
        <button type="submit" className="btn primary" disabled={pending || disabled || Boolean(disabledReason)}>
          {pending ? "Processing..." : cta ?? (isWrite ? "Submit" : "Check")}
        </button>
        {error && <span className="error-text">{error}</span>}
      </div>
      {result && (
        <pre className="action-output" aria-live="polite">
          {result}
        </pre>
      )}
    </form>
  );
}

interface InputFieldProps {
  type: string;
  value: string;
  onChange(value: string): void;
}

function InputField({ type, value, onChange }: InputFieldProps) {
  const inputType = type.startsWith("uint") || type.startsWith("int") ? "number" : "text";
  const placeholder = useMemo(() => {
    if (type === "bool") return "true / false";
    if (type.startsWith("bytes32")) return "0x... or text";
    if (type.endsWith("[]")) return "Comma separated";
    return undefined;
  }, [type]);

  if (type === "bool") {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select...</option>
        <option value="true">True</option>
        <option value="false">False</option>
      </select>
    );
  }

  return <input type={inputType} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}
