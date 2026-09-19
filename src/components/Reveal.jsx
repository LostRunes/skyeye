import { useInView } from '../hooks/useInView'

export default function Reveal({ as: Tag = 'div', className = '', delay = 0, children, ...rest }) {
  const { ref, inView } = useInView()
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'reveal--visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...rest}
    >
      {children}
    </Tag>
  )
}
