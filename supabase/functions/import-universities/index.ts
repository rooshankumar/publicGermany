import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import * as XLSX from "npm:xlsx@0.18.5";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Fetching Excel file from storage...');
    
    // Fetch the Excel file from public bucket
    const { data: fileData, error: storageError } = await supabase.storage
      .from('university')
      .download('universities.xlsx');

    if (storageError) {
      console.error('Storage error:', storageError);
      throw new Error(`Failed to fetch Excel file: ${storageError.message}`);
    }

    console.log('Parsing Excel file...');
    
    // Convert blob to array buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${jsonData.length} rows in Excel`);

    const skippedRows: any[] = [];
    const insertedRows: any[] = [];
    const updatedRows: any[] = [];

    // Get auth user from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Process each row
    for (const row of jsonData) {
      try {
        const university = (row as any)['University'] || (row as any)['university'];
        const program = (row as any)['Program'] || (row as any)['program'];

        // Skip if university or program is missing
        if (!university || !program) {
          skippedRows.push({ row, reason: 'Missing university or program name' });
          continue;
        }

        // Map Excel columns to database fields
        const applicationData = {
          user_id: user.id,
          university_name: String(university).trim(),
          program_name: String(program).trim(),
          ielts_requirement: (row as any)['IELTS'] || (row as any)['ielts'] || null,
          german_requirement: (row as any)['German'] || (row as any)['german'] || null,
          fees_eur: parseFloat((row as any)['Fees'] || (row as any)['fees']) || null,
          application_end_date: (row as any)['Deadline'] || (row as any)['deadline'] || null,
          application_method: (row as any)['Application'] || (row as any)['application'] || null,
          required_tests: (row as any)['Test'] || (row as any)['test'] || null,
          portal_link: (row as any)['Portal Link'] || (row as any)['portal_link'] || null,
          notes: (row as any)['NOTE'] || (row as any)['note'] || (row as any)['notes'] || null,
          status: 'draft' as const,
        };

        // Insert with ON CONFLICT UPDATE
        const { data, error } = await supabase
          .from('applications')
          .upsert(applicationData, {
            onConflict: 'user_id,university_name,program_name',
            ignoreDuplicates: false,
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          skippedRows.push({ row, reason: error.message });
        } else {
          // Check if it was an insert or update
          if (data) {
            insertedRows.push(data);
          } else {
            updatedRows.push(applicationData);
          }
        }
      } catch (rowError) {
        console.error('Row processing error:', rowError);
        skippedRows.push({ row, reason: String(rowError) });
      }
    }

    console.log(`Import complete: ${insertedRows.length} inserted, ${updatedRows.length} updated, ${skippedRows.length} skipped`);

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertedRows.length,
        updated: updatedRows.length,
        skipped: skippedRows.length,
        skippedDetails: skippedRows,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
