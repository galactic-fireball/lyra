from astropy.io import fits
import numpy as np

from lyra.models import Spectrum


def dered(wave, z=0.0):
    return wave / (1 + z)


class SDSSSpectrum(Spectrum):

    @classmethod
    def from_file(cls, spec_file, parent_collection):
        info_dict = {
            'name': spec_file.stem,
            'file': str(spec_file),
            'collection': parent_collection.name,
            'metadata': {},
        }

        with fits.open(spec_file) as hdu:
            specobj = hdu[2].data
            info_dict['metadata']['redshift'] = float(specobj['z'][0])

            if 'RA' in hdu[0].header:
                info_dict['metadata']['ra'] = hdu[0].header['RA']
                info_dict['metadata']['dec'] = hdu[0].header['DEC']
            elif 'PLUG_RA' in hdu[0].header:
                info_dict['metadata']['ra'] = specobj['PLUG_RA'][0]
                info_dict['metadata']['dec'] = specobj['PLUG_DEC'][0]

            t = hdu[1].data

            info_dict['data'] = t['flux'].copy()
            info_dict['noise'] = np.sqrt(1 / t['ivar'])

            obs_wave = np.power(10, t['loglam'])
            info_dict['wave'] = dered(obs_wave, info_dict['metadata']['redshift'])

        return cls(**info_dict)
