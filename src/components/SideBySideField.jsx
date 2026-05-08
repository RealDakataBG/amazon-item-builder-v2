import CopyButton from './CopyButton'

export default function SideBySideField({ label, labelSuffix, leftValue, onLeftChange, leftMinHeight = 'min-h-32' }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="label-muted">{label}</span>
          {labelSuffix}
        </div>
        <CopyButton text={leftValue} />
      </div>
      <textarea
        value={leftValue}
        onChange={e => onLeftChange(e.target.value)}
        className={`input-base text-sm leading-relaxed resize-y w-full ${leftMinHeight}`}
        spellCheck={false}
      />
    </div>
  )
}
