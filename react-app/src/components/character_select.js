import Select from 'react-select';

export const CharaSelecter = (props) => {
  const { onChange, list, placeholder } = props
  const onChangeHandler = (event) => {
    onChange(event.value)
  }
  return (
    <Select placeholder={placeholder} options={list} onChange={ (e) => onChangeHandler(e) }/>
  )
}
