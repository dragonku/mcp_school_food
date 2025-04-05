class ZenInputField extends StatelessWidget {
  final String label;
  final String? hint;
  final TextEditingController controller;
  final bool isMultiline;
  final String? Function(String?)? validator;
  
  const ZenInputField({
    Key? key,
    required this.label,
    this.hint,
    required this.controller,
    this.isMultiline = false,
    this.validator,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      decoration: InputDecoration(
        labelText: label,
        hintText: hint,
      ),
      maxLines: isMultiline ? null : 1,
      validator: validator,
    );
  }
} 