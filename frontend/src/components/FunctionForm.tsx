import { FormEvent, useMemo, useState } from "react";
import { AbiFunction, Contract, ContractTransactionResponse } from "ethers";
import { parseInputValue } from "../lib/inputs";

interface FunctionFormProps {
  func: AbiFunction;
  contract: Contract;
  writeContract?: Contract;
  disabled?: boolean;
  isWrite: boolean;
  defaultValue?: string;
}

export function FunctionForm({ func, contract, writeContract, disabled, isWrite }: FunctionFormProps) {
  const [inputs, setInputs] = useState<string[]>(() => func.inputs?.map(() => "") ?? []);
  const [value, setValue] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [pending, setPending] = useState(false);

  const inputTypes = useMemo(() => func.inputs ?? [], [func.inputs]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setResult("");

    try {
      const parsed = inputTypes.map((input, idx) => parseInputValue(input.type, inputs[idx] ?? ""));

      if (func.stateMutability === "view" || func.stateMutability === "pure") {
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
      setResult(`Tx ${receipt?.hash ?? tx.hash}`);
    } catch (err: any) {
      console.error(err);
      const reason = err?.error?.message || err?.data?.message || err?.message || "Unknown error";
      setError(reason);
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="function-card" onSubmit={handleSubmit}>
      <header className="function-header">
        <h4>{func.name}</h4>
        <span>{func.stateMutability}</span>
      </header>
      <div className="function-fields">
        {inputTypes.map((input, idx) => (
          <label key={input.name || idx}>
            <span>{input.name || `arg${idx}`} ({input.type})</span>
            <InputField
              type={input.type}
              value={inputs[idx] ?? ""}
              onChange={(next) =>
                setInputs((prev) => {
                  const copy = [...prev];
                  copy[idx] = next;
                  return copy;
                })
              }
            />
          </label>
        ))}
        {func.stateMutability === "payable" && (
          <label>
            <span>msg.value (tinybars / wei)</span>
            <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="0" />
          </label>
        )}
      </div>
      <div className="function-actions">
        <button type="submit" disabled={disabled || pending} className={`btn ${isWrite ? "primary" : "ghost"}`}>
          {pending ? "Sending..." : isWrite ? "Write" : "Read"}
        </button>
        {error && <span className="error-text">{error}</span>}
      </div>
      {result && <pre className="function-output">{result}</pre>}
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
    if (type.startsWith("bytes32")) return "0x... or ascii";
    if (type.endsWith("[]")) return "comma separated";
    return undefined;
  }, [type]);

  if (type === "bool") {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select...</option>
        <option value="true">true</option>
        <option value="false">false</option>
      </select>
    );
  }

  return <input type={inputType} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />;
}
