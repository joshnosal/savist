import InputContainer from "../../../components/input_container"
import InputBase from '../../../components/input_base'
import FormContainer from "../../../components/form_container"

export default function BillingForm(props) {
  const { state, dispatch, sx, userToken, user } = props
  const textInputs = [
    {type: 'name', width: null, title: 'Name on Card'},
    {type: 'line1', width: '160px', title: 'Address Line 1'},
    {type: 'line2', width: '160px', title: 'Address Line 2'},
    {type: 'postal_code', width: '160px', title: 'Zip'},
  ]

  const handleBlur = (prop) => (e) => dispatch({ type: 'set', state: { focusedElement: null } })
  const handleFocus = (prop) => (e) => dispatch({ type: 'set', state: { focusedElement: prop } })
  const handleChange = (prop) => (e) => {
    let error = !e.target.value && prop !== 'line2' && {message: 'Required'}
    dispatch({ type: 'set', state: { [prop]: {value: e.target.value, error: error}, processing_error: null } })
  }

  return (
    <FormContainer>
      {textInputs.map((input, idx) => (
        <InputContainer
          key={idx}
          title={input.title}
          error={state[input.type].error}
          focused={state.focusedElement === input.type}
          width={input.width}
          sx={sx}
        >
          <InputBase
            onChange={handleChange(input.type)}
            value={state[input.type].value}
            onFocus={handleFocus(input.type)}
            onBlur={handleBlur(input.type)}
          />
        </InputContainer>
      ))}
    </FormContainer>
  )
}